import React from "react";

export default function SimpleApp() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Book Inventory App</h1>
      <p className="text-gray-600 mb-4">React is working correctly</p>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Quick Test</h2>
        <p>If you can see this, React initialization is successful.</p>
      </div>
    </div>
  );
}