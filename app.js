// Initialize PeerJS (connects to a public free signaling broker)
const peer = new Peer();

let conn;
const myIdDisplay = document.getElementById('my-id');
const peerIdInput = document.getElementById('peer-id-input');
const connectBtn = document.getElementById('connect-btn');
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// Display your unique peer ID once generated
peer.on('open', (id) => {
    myIdDisplay.innerText = id;
});

// Handle incoming connection requests from other peers
peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
    appendMessage("System", "A friend connected to you!");
});

// Connect to a peer when you enter their ID and click connect
connectBtn.addEventListener('click', () => {
    const peerId = peerIdInput.value;
    conn = peer.connect(peerId);
    setupConnection();
    appendMessage("System", "Connected to peer!");
});

// Enable chat inputs once a connection is established
function setupConnection() {
    messageInput.disabled = false;
    sendBtn.disabled = false;

    conn.on('data', (data) => {
        appendMessage("Friend", data);
    });
}

// Send message over the direct P2P data channel
sendBtn.addEventListener('click', () => {
    const message = messageInput.value;
    if (message && conn) {
        conn.send(message);
        appendMessage("You", message);
        messageInput.value = '';
    }
});

// Helper function to show messages in the chat box
function appendMessage(sender, text) {
    const p = document.createElement('div');
    p.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}
