export default {
  path: "/",
  component: "../src/layouts/GlobalLayout",
  children: [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/home",
      name: "首页",
      component: "../src/pages/Home",
    },
    {
      component: "../src/components/NotFoundPage",
    },
  ],
};
