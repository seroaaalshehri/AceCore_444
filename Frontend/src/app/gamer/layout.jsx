import NotificationListener from "./NotificationListener";

export default function GamerLayout({ children }) {
  return (
    <>
      <NotificationListener />
      {children}
    </>
  );
}
