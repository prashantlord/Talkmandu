import {v4 as uuidv4} from "uuid";

export function getUserId() {
    let id = localStorage.getItem("talkmandu_uid");
    if (!id) {
        id = uuidv4();
        localStorage.setItem("talkmandu_uid", id);
    }
    return id;
}
