import { useMutation } from "@apollo/client";
import React from "react";
import { useState } from "react";
import { LOGIN } from "../queries";

const LoginForm = (props) => {
  const [loginUser] = useMutation(LOGIN);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  if (!props.show) {
    return null;
  }
  return (
    <form
      style={{ paddingTop: "1rem" }}
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const token = await (
            await loginUser({ variables: { username, password } })
          ).data.login.value;
          props.setToken(token);

          localStorage.setItem("library-user-token", token);
          props.setPage("authors");
        } catch (error) {}
      }}
    >
      <div>
        username:
        <input
          type="text"
          name="username"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div style={{ paddingTop: ".5rem" }}>
        Password:
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button>Login</button>
    </form>
  );
};

export default LoginForm;
