// Sample JavaScript code with common pitfalls

function authenticateUser(userId, token) {
  // Issue 1: Loose equality comparison
  if (userId == 0) {
    console.log("Guest login");
  }

  // Issue 2: Accidental global variable (missing let/const)
  activeSession = { id: userId, token: token };

  return activeSession;
}

// Issue 3: Async function missing error handling and floating promise
async function fetchUserDashboard(apiUrl) {
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  // Issue 4: Potential memory leak with unremoved listener
  window.addEventListener('resize', () => {
    console.log('Window resized for user:', data.name);
  });

  return data;
}
