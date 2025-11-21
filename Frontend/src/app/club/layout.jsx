import NotificationListener from "../gamer/NotificationListener";

export default function GamerLayout({ children }) {
  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
}
