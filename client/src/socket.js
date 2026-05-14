import {io} from "socket.io-client";

const socket = io("https://talkmandu-backend.prashant.social", {autoConnect: true});

export default socket;
