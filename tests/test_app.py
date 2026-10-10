from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities as initial_activities
from src.app import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def test_activities(monkeypatch):
    activities = deepcopy(initial_activities)
    monkeypatch.setattr("src.app.activities", activities)
    return activities


def test_get_activities_returns_all_activities(client, test_activities):
    # Arrange
    expected_activities = test_activities

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == expected_activities


def test_signup_adds_student_to_activity(client, test_activities):
    # Arrange
    activity_name = "Chess Club"
    email = "student@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {
        "message": f"Signed up {email} for {activity_name}"
    }
    assert email in test_activities[activity_name]["participants"]
