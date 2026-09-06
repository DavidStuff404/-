let peer = null;
let isHost = false;
let connections = []; 
let hostConnection = null; 
let chatHistory = []; // The Host will use this to remember messages

const usernameInput = document.getElementById('username');
const avatarInput = document.getElementById('avatar');
const channelInput = document.getElementById('channel-name');
const enterBtn = document.getElementById('enter-btn'); // Replace your old buttons with this in HTML
const statusText = document.getElementById('status-text');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// --- THE SMART "ENTER" BUTTON ---
enterBtn.addEventListener('click', () => {
    if (!usernameInput.value || !channelInput.value) {
        alert("Please enter a username and channel name!");
        return;
    }

    const channelId = "p2p-room-" + channelInput.value.toLowerCase();
    statusText.innerText = "Searching for channel...";
    enterBtn.disabled = true;

    // First, act as a Client and try to find the room
    peer = new Peer(); 

    peer.on('open', () => {
        hostConnection = peer.connect(channelId);

        // If the room exists and we connect successfully:
        hostConnection.on('open', () => {
            isHost = false;
            statusText.innerText = `Joined existing channel: ${channelInput.value}`;
            enableChat();
        });

        // Listen for incoming messages OR chat history from the Host
        hostConnection.on('data', (data) => {
            if (data.type === 'history') {
                // Load past messages
                data.messages.forEach(msg => displayMessage(msg));
            } else {
                // Load standard single message
                displayMessage(data);
            }
        });
    });

    // If the room DOES NOT exist, PeerJS throws an error. We catch it and become the Host!
    peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
            statusText.innerText = "Channel not found. Creating a new one...";
            peer.destroy(); // Kill the client peer
            startAsHost(channelId); // Start over as Host
        }
    });
});


// --- HOST LOGIC ---
function startAsHost(channelId) {
    peer = new Peer(channelId); 
    isHost = true;

    peer.on('open', () => {
        statusText.innerText = `You created the channel: ${channelInput.value}`;
        enableChat();
    });

    peer.on('connection', (conn) => {
        connections.push(conn);
        
        // When someone joins, instantly send them the chat history!
        conn.on('open', () => {
            conn.send({ type: 'history', messages: chatHistory });
        });

        conn.on('data', (data) => {
            chatHistory.push(data); // Save to history
            displayMessage(data);   // Show locally
            broadcastMessage(data, conn.peer); // Send to everyone else
        });
    });
}

// --- SENDING MESSAGES ---
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage(); // Added Enter key support!
});

function sendMessage() {
    const text = messageInput.value;
    if (!text) return;

    const messageData = {
        name: usernameInput.value,
        avatar: avatarInput.value || "https://i.imgur.com/8B1lOoo.png",
        text: text,
        senderId: peer.id 
    };

    displayMessage(messageData);
    messageInput.value = '';

    if (isHost) {
        chatHistory.push(messageData); // Host saves their own message to history
        broadcastMessage(messageData, peer.id); 
    } else if (hostConnection) {
        hostConnection.send(messageData); 
    }
}

// --- HELPER FUNCTIONS ---
function enableChat() {
    messageInput.disabled = false;
    sendBtn.disabled = false;
    document.getElementById('setup-panel').style.opacity = '0.5'; 
}

function broadcastMessage(data, senderPeerId) {
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
