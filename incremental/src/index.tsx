/* @refresh reload */
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import "./index.css";

function StackCheck() {
  const [count, setCount] = createSignal(0);
  return (
    <main>
      <h1>Solid</h1>
      <button type="button" onClick={() => setCount(count() + 1)}>
        count: {count()}
      </button>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("incremental: missing #root");
render(() => <StackCheck />, root);