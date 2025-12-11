const takeAction = (action, gameStatus) => {
    console.log("Taking action:", action, "with game status:", gameStatus);
  return fetch('/take_action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ game_action: action, game_status: gameStatus }),
  })
    .then((response) => response.json()).then((data) => {
        console.log("Received response from take_action:", data);
        return data;
    })
    .catch((error) => {
      console.error('Error taking action:', error);
      throw error;
    });
};

export default takeAction;