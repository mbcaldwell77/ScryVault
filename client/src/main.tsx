import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Minimal test component without any dependencies
function TestComponent() {
  return React.createElement("div", { 
    style: { padding: "20px", backgroundColor: "#f0f0f0", minHeight: "100vh" }
  }, [
    React.createElement("h1", { key: "title" }, "Book Inventory App"),
    React.createElement("p", { key: "status" }, "React is working correctly"),
    React.createElement("div", { 
      key: "card",
      style: { 
        backgroundColor: "white", 
        padding: "16px", 
        borderRadius: "8px", 
        marginTop: "16px" 
      }
    }, [
      React.createElement("h2", { key: "cardTitle" }, "System Status"),
      React.createElement("p", { key: "cardText" }, "Application initialized successfully")
    ])
  ]);
}

const container = document.getElementById("root");
if (!container) throw new Error("Failed to find the root element");

const root = createRoot(container);
root.render(React.createElement(TestComponent));
