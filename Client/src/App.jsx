import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import RandomMeetingRoom from "./pages/RandomMeetingRoom.jsx";
import MeetingRoom from "./pages/MeetingRoom.jsx";

export default function App() {
    const router = createBrowserRouter([
        {path: "/", element: <Landing/>},
        {path: "/meeting/:roomId", element: <MeetingRoom/>},
        {path: "/random", element: <RandomMeetingRoom/>},
    ]);

    return <RouterProvider router={router}/>;
}
