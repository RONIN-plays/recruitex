import { ModernStunningSignIn } from "@/components/ui/modern-stunning-sign-in";

const ModernSignInDemo = () => {
  const handleSignIn = (email: string, password: string) => {
    console.log("Sign in with:", email, password);
    alert("Sign in successful! (Demo)");
  };

  const handleGoogleSignIn = () => {
    console.log("Google sign in");
    alert("Google sign in! (Demo)");
  };

  const handleSignUp = () => {
    console.log("Navigate to sign up");
    alert("Navigate to sign up! (Demo)");
  };

  return (
    <ModernStunningSignIn
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onSignUp={handleSignUp}
    />
  );
};

export { ModernSignInDemo };