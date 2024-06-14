const connectedUsers = new Set();

function addConnectedUser(id){
  connectedUsers.add(id);
}

function removeConnectedUser(id){
  connectedUsers.delete(id);
}

function getConnectedUsers(){
  return Array.from(connectedUsers);
}
