document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    const response = await fetch("/activities");
    if (!response.ok) {
      throw new Error("Failed to load activities.");
    }

    const activities = await response.json();
    activitiesList.replaceChildren();
    activitySelect.replaceChildren(activitySelect.options[0]);

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const title = document.createElement("h4");
      title.textContent = name;
      activityCard.appendChild(title);

      const description = document.createElement("p");
      description.textContent = details.description;
      activityCard.appendChild(description);

      const schedule = document.createElement("p");
      schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
      activityCard.appendChild(schedule);

      const availability = document.createElement("p");
      availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
      activityCard.appendChild(availability);

      const participantsSection = document.createElement("section");
      participantsSection.className = "participants-section";
      const participantsHeading = document.createElement("h5");
      participantsHeading.textContent = `Participants (${details.participants.length})`;
      participantsSection.appendChild(participantsHeading);

      if (details.participants.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "no-participants";
        emptyState.textContent = "No participants yet";
        participantsSection.appendChild(emptyState);
      } else {
        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          const participantEmail = document.createElement("span");
          participantEmail.textContent = email;
          participant.appendChild(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant";
          removeButton.textContent = "×";
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
              const unregisterResponse = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await unregisterResponse.json();

              if (!unregisterResponse.ok) {
                throw new Error(result.detail || "Failed to unregister participant.");
              }

              await fetchActivities();
              showMessage(result.message, "success");
            } catch (error) {
              showMessage(error.message || "Failed to unregister participant.", "error");
              console.error("Error unregistering participant:", error);
              removeButton.disabled = false;
            }
          });
          participant.appendChild(removeButton);
          participantsList.appendChild(participant);
        });

        participantsSection.appendChild(participantsList);
      }

      activityCard.appendChild(participantsSection);
      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const signupResponse = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      const result = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(result.detail || "An error occurred.");
      }

      signupForm.reset();
      await fetchActivities();
      showMessage(result.message, "success");
    } catch (error) {
      showMessage(error.message || "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities().catch((error) => {
    activitiesList.textContent = "Failed to load activities. Please try again later.";
    console.error("Error fetching activities:", error);
  });
});
