import Logo from './Logo';

function AuthLayout({ children }) {
  return (
    <div className="pc-auth">
      <aside className="pc-auth__hero">
        <div className="pc-brand pc-brand--light">
          <Logo />
          <span>PlantCare AI</span>
        </div>

        <div>
          <h1>The green thumb you always wanted.</h1>
          <p>
            Upload a leaf photo, get an AI-assisted health check, and keep a care history
            for every plant in your garden.
          </p>
        </div>

        <small>© {new Date().getFullYear()} PlantCare AI. All rights reserved.</small>
      </aside>

      <main className="pc-auth__main">{children}</main>
    </div>
  );
}

export default AuthLayout;
