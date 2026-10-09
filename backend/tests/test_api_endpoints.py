import pytest
import json
from app.main import create_app
from app.models.database import db, Caregiver, FallEvent, SystemSettings

@pytest.fixture
def app():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SIMULATOR_AUTOSTART"] = "false"
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_endpoint(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"

def test_dashboard_endpoint(client):
    res = client.get('/api/dashboard')
    assert res.status_code == 200
    data = res.get_json()
    assert "falls_today" in data
    assert "monitoring_active" in data

def test_caregiver_crud(client):
    # 1. Create
    payload = {
        "name": "Jane Doe",
        "phone": "+15551234567",
        "email": "jane@example.com",
        "relationship": "Sister",
        "is_primary": True
    }
    res = client.post('/api/caregivers', data=json.dumps(payload), content_type='application/json')
    assert res.status_code == 201
    cg_id = res.get_json()["caregiver"]["id"]

    # 2. List
    res_list = client.get('/api/caregivers')
    assert res_list.status_code == 200
    items = res_list.get_json()
    assert len(items) >= 1

    # 3. Update
    res_up = client.put(f'/api/caregivers/{cg_id}', data=json.dumps({"name": "Jane Smith"}), content_type='application/json')
    assert res_up.status_code == 200
    assert res_up.get_json()["caregiver"]["name"] == "Jane Smith"

    # 4. Delete
    res_del = client.delete(f'/api/caregivers/{cg_id}')
    assert res_del.status_code == 200

def test_manual_alert_test(client):
    res = client.post('/api/alerts/test')
    assert res.status_code == 200
    data = res.get_json()
    assert "logs" in data

def test_controlled_test_suite_runner(client):
    res = client.post('/api/tests/run')
    assert res.status_code == 200
    data = res.get_json()
    assert data["summary"]["passed"] == len(data["details"])

def test_csv_export(client):
    res = client.get('/api/reports/export')
    assert res.status_code == 200
    assert res.mimetype == "text/csv"
    assert "Event ID" in res.get_data(as_text=True)
