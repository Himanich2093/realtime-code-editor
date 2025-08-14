import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("//start coding here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [userLeftMsg, setUserLeftMsg] = useState("");
  const [typing, setTyping] = useState("");

  useEffect(() => {
    // Listen for user list updates from server
    socket.on("userJoined", (userList) => {
      setUsers(userList);
    });
    // Listen for code updates from server
    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });
    // Listen for user joined event
    socket.on("user-joined", (user) => {
      console.log(`${user} joined the room`);
    });
    // Listen for typing indicator
    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is Typing`);
      setTimeout(() => setTyping(""), 2000);
    });
    socket.on("languageUpdate", (newLanguage) => {
      console.log(`Received language change: ${newLanguage}`);
      setLanguage(newLanguage);
    });
    // To notify when a user leaves the room
    socket.on("user-left", (user) => {
      setUserLeftMsg(`${user} left the room`);
      setTimeout(() => setUserLeftMsg(""), 2000);
    });
    // Clean up listeners on unmount
    return () => {
  socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("user-joined");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("user-left");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("//start coding here");
    setUsers([]);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {  // handle language change
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
    console.log(`Emitting language change: ${newLanguage} to room: ${roomId}`);
  };

  if (!joined) {
    return (
      <div className="join-container">  
        <div className="join-form">
          <h1>Join Coding Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="sideBar">
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button className="copy-button" onClick={copyRoomId}>
            Copy Id
          </button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
          {userLeftMsg && <span className="user-left-msg">{userLeftMsg}</span>}
        </div>
        <h3>Users in room:</h3>
        <ul>
          {users.map((user, idx) => (
            <li key={idx}>{user.slice(0, 8)}...</li>
          ))}
        </ul>
        <p className="typing-indicator">{typing}</p>
        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button className="leave-button" onClick={handleLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
          }}
        />
      </div>
    </div>
  );
};

export default App;