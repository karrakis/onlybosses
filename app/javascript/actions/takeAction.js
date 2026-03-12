const takeAction = (action) => {
    console.log("Taking action:", action);
  return fetch('/take_action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ game_action: action }),
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