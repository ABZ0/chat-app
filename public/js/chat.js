const socket = io();

// SECTION Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// SECTION Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const urlTemplate = document.querySelector("#location-message-template")
    .innerHTML;

const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// SECTION Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});
const autoscroll = () => {
    // Grab new message
    const $newMessage = $messages.lastElementChild;

    // Get height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

// NOTE Listen for server messages and display them for the user
socket.on("serverMessage", message => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm A")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", message => {
    console.log(message);
    const html = Mustache.render(urlTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm A")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
});

// NOTE Client messages to the server
// REVIEW emit(event, answer function, acknowledgment)
$messageForm.addEventListener("submit", event => {
    event.preventDefault();
    $messageFormButton.setAttribute("disabled", "disabled");

    const userMessage = event.target.elements.message.value;
    socket.emit("sendMessage", userMessage, error => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        // If profanity was sent
        if (error) {
            return console.log(error);
        }
        console.log("Delivered!");
    });
});

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");
    navigator.geolocation.getCurrentPosition(position => {
        const locationMessage = `https://google.com/maps?q=${
            position.coords.latitude
        },${position.coords.longitude}`;

        socket.emit("sendLocation", locationMessage, () => {
            $sendLocationButton.removeAttribute("disabled");
            console.log("Location shared!");
        });
    });
});

socket.emit("join", { username, room }, error => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
