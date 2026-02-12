const takeAction = (action, gameStatus, actionTaker = 'player', target = 'boss') => {
    console.log("Taking action:", action, "with game status:", gameStatus, "action_taker:", actionTaker, "target:", target);
  return fetch('/take_action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ game_action: action, game_status: gameStatus, action_taker: actionTaker, target: target }),
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