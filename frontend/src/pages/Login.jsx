import AuthForm from "../components/AuthForm.jsx";
import { useSession } from "../context/SessionContext.jsx";


export default function Login() {
  const { handleAuthSuccess } = useSession();

  return <AuthForm mode="login" onAuthSuccess={handleAuthSuccess} />;
}
