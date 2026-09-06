let peer = null;
let isHost = false;
let connections = []; // Used by Host to store everyone in the channel
let hostConnection = null; // Used by Client to talk to the Host

const usernameInput = document.getElementById('username');
const avatarInput = document.getElementById('avatar');
const channelInput = document.getElementById('channel-name');
const createBtn = document.getElementById('create-btn');
const joinBtn = document.getElementById('join-btn');
const statusText = document.getElementById('status-text');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// --- CREATING A CHANNEL (Acting as Host) ---
createBtn.addEventListener('click', () => {
    if (!validateProfile()) return;
    
    const channelId = "p2p-room-" + channelInput.value.toLowerCase();
    peer = new Peer(channelId); // Force the Peer ID to be the channel name
    isHost = true;

    peer.on('open', () => {
        statusText.innerText = `Channel created! Tell friends to join: ${channelInput.value}`;
        enableChat();
    });

    // When someone joins your channel
    peer.on('connection', (conn) => {
        connections.push(conn);
        
        conn.on('data', (data) => {
            // Display the message locally
            displayMessage(data);
            // Host superpower: broadcast the message to everyone else in the room
            broadcastMessage(data, conn.peer); 
        });
    });
});

// --- JOINING A CHANNEL (Acting as Client) ---
joinBtn.addEventListener('click', () => {
    if (!validateProfile()) return;

    peer = new Peer(); // Get a random ID for yourself
    
    peer.on('open', () => {
        const channelId = "p2p-room-" + channelInput.value.toLowerCase();
        hostConnection = peer.connect(channelId);
        
        hostConnection.on('open', () => {
            statusText.innerText = `Joined channel: ${channelInput.value}`;
            enableChat();
        });

        // Listen for messages relayed by the host
        hostConnection.on('data', (data) => {
            displayMessage(data);
        });
    });
});

// --- SENDING MESSAGES ---
sendBtn.addEventListener('click', () => {
    const text = messageInput.value;
    if (!text) return;

    // Package the message with profile info
    const messageData = {
        name: usernameInput.value,
        avatar: avatarInput.value || "https://i.imgur.com/8B1lOoo.png", // Default avatar
        text: text,
        senderId: peer.id 
    };

    displayMessage(messageData); // Show it on your own screen

    if (isHost) {
        broadcastMessage(messageData, peer.id); // Host sends to everyone
    } else if (hostConnection) {
        hostConnection.send(messageData); // Client sends to Host
    }
    
    messageInput.value = '';
});

// --- HELPER FUNCTIONS ---
function validateProfile() {
    if (!usernameInput.value || !channelInput.value) {
        alert("Please enter a username and channel name!");
        return false;
    }
    return true;
}

function enableChat() {
    messageInput.disabled = false;
    sendBtn.disabled = false;
    document.getElementById('setup-panel').style.opacity = '0.5'; // Dim setup area
}

function broadcastMessage(data, senderPeerId) {
    // Send data to all connections EXCEPT the person who originally sent it
    connections.forEach(conn => {
        if (conn.peer !== senderPeerId) {
            conn.send(data);
        }
    });
}

function displayMessage(data) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.innerHTML = `
        <img src="${data.avatar}" class="avatar" onerror="this.src='https://i.imgur.com/8B1lOoo.png'">
        <div>
            <div class="msg-header">${data.name}</div>
            <div class="msg-text">${data.text}</div>
        </div>
    `;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
