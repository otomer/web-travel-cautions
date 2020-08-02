const posts = [
  "The most perfidious way of harming a cause consists of defending it deliberately with faulty arguments.",
  "Anger is never without Reason, but seldom with a good One.",
  "I'm kind of jealous of the life I'm supposedly leading.",
];

const defaultRoute = "/spa";

const routes = {
  "/posts/post1": posts[0],
  "/posts/post2": posts[1],
  "/posts/post3": posts[2],
  "/spa": "Home",
};

const rootDiv = document.getElementById("root");
rootDiv.innerHTML = routes[window.location.pathname]
  ? routes[window.location.pathname]
  : routes[defaultRoute];

const onNavigate = (pathname) => {
  window.history.pushState({}, pathname, window.location.origin + pathname);
  rootDiv.innerHTML = routes[pathname];
};

window.onpopstate = () => {
  rootDiv.innerHTML = routes[window.location.pathname];
};
