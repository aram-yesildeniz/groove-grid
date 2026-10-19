<main>
  <h1>Groove Grid</h1>
</main>

<style>
  :global(:root) {
    --surface: #f7f3ea;
    --ink: #1d1b16;
  }

  :global(body) {
    margin: 0;
    background: var(--surface);
    color: var(--ink);
    font-family: system-ui, sans-serif;
  }

  main {
    min-height: 100dvh;
    display: grid;
    place-items: center;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
  }
</style>
