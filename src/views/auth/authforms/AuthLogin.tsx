import { Button, Checkbox, Label, TextInput, Alert } from "flowbite-react";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useAuthStore } from "../../../store/authStore";

const AuthLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      // Login successful, redirect to Dashboard
      navigate("/");
    } catch (err: any) {
      console.error(err);
      if (err.response) {
        setError(err.response.data.detail || "Error de autenticación");
      } else {
        setError("No se pudo conectar con el servidor");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} >
        {error && (
          <Alert color="failure" className="mb-4">
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="Username" value="Username" />
          </div>
          <TextInput
            id="Username"
            type="text"
            sizing="md"
            required
            className="form-control form-rounded-xl"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="userpwd" value="Password" />
          </div>
          <TextInput
            id="userpwd"
            type="password"
            sizing="md"
            required
            className="form-control form-rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex justify-between my-5">
          <div className="flex items-center gap-2">
            <Checkbox id="accept" className="checkbox" />
            <Label
              htmlFor="accept"
              className="opacity-90 font-normal cursor-pointer"
            >
              Remember this Device
            </Label>
          </div>
          <Link to={"/"} className="text-primary text-sm font-medium">
            Forgot Password ?
          </Link>
        </div>
        <Button
          type="submit"
          color={"primary"}
          className="w-full bg-primary text-white rounded-xl"
          isProcessing={loading}
          disabled={loading}
        >
          Sign in
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;
