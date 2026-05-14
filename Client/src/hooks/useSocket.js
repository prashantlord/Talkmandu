import {useMemo} from "react";
import socket from "../socket.js";

export default function useSocket() {
    return useMemo(() => socket, []);
}
