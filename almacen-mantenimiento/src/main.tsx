import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:24,fontFamily:'monospace',background:'#fee2e2',minHeight:'100vh'}}>
          <h2 style={{color:'#dc2626'}}>Error al cargar la app</h2>
          <pre style={{whiteSpace:'pre-wrap',color:'#7f1d1d'}}>{this.state.error.message}</pre>
          <pre style={{whiteSpace:'pre-wrap',color:'#7f1d1d',fontSize:12}}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
