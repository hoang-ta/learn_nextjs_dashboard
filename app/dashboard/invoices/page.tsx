export default async function Page() {
  let done = false;
  await new Promise((res) => setTimeout(res, 4000));
  done = true;
  return done ? <p>Invoices</p> : <>...</>;
}
