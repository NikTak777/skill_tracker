import AuthForm from "../components/AuthForm.jsx";
import { useSession } from "../context/SessionContext.jsx";


export default function Register() {
  const { handleAuthSuccess } = useSession();

  return <AuthForm mode="register" onAuthSuccess={handleAuthSuccess} />;
}
