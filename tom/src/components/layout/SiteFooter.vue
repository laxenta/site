<template>
  <footer class="dark-footer">
    <div class="dark-footer__container">
      <div class="dark-footer__top">
        <div class="footer-branding">
          <h2 class="brand-title">Keep Exploring, Stay Awesome ily :3</h2>
          <p class="brand-subtitle">Be the best in life, Jesus loves you!...</p>
        </div>
        <nav class="footer-columns">
          <div class="footer-col" v-for="(section, index) in sections" :key="index">
            <h4>{{ section.title }}</h4>
            <ul>
              <li v-for="(link, linkIndex) in section.links" :key="linkIndex">
                <router-link :to="link.path">{{ link.name }}</router-link>
              </li>
            </ul>
          </div>
        </nav>
        <div class="footer-social">
          <a v-for="(social, index) in socialLinks" :key="index" :href="social.url" target="_blank">
            <i :class="social.icon"></i>
          </a>
        </div>
      </div>
      <div class="dark-footer__bottom">
        <p>&copy; {{ currentYear }} made with luv by @me_straight | change it in SiteFooter.vue if you want</p> 
      </div>
    </div>
  </footer>
</template>
<script>
export default {
  name: "UwUFooter",
  data() {
    return {
      currentYear: new Date().getFullYear(),
      sections: [
        { title: "Wellness", links: [
          { name: "Yoga", path: "/yoga" }
        ]},
        { title: "Music", links: [
          { name: "Singing", path: "/singing" },
          { name: "Vocal Training", path: "/vocal" }
         // { name: "Music Progress", path: "/music-pr" } i might add these, its js placeholders
        ]},
        { title: "Games", links: [
          { name: "Chess", path: "/chesshome" },
          { name: "Puzzles", path: "/puzzles" },
          { name: "Multiplayer", path: "/multiplayer" }
        ]},
        { title: "Community", links: [
          { name: "Progress", path: "/progress" }
          // placeholder obv { name: "Events", path: "/events" } 
        ]}
      ],
      socialLinks: [
        { icon: "fab fa-discord", url: "https://discord.com/your mom" },
        { icon: "fab fa-twitter", url: "https://putyolinkfr" },
        { icon: "fab fa-instagram", url: "https://" }, //guy will put his stuff here himself, its not rlly hard for any1
        { icon: "fab fa-youtube", url: "https://" }
      ]
    };
  },
  mounted() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
      document.head.appendChild(link);
    }
  }
};
</script>
<style scoped>
.dark-footer {
  background-color: #000;
  color: #fff;
  padding: 20px 0;
  text-align: center;
}
.dark-footer__container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.dark-footer__top {
  display: flex;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
}
.footer-branding {
  text-align: left;
  flex: 1;
}
.footer-columns {
  display: flex;
  gap: 20px;
  flex: 2;
  justify-content: center;
}
.footer-col {
  text-align: left;
}
.footer-col h4 {
  margin-bottom: 10px;
}
.footer-col ul {
  list-style: none;
  padding: 0;
}
.footer-col li {
  margin-bottom: 5px;
}
.footer-col a {
  color: #fff;
  text-decoration: none;
  transition: color 0.3s;
}
.footer-col a:hover {
  color: #0af;
}
.footer-social {
  display: flex;
  gap: 10px;
}
.footer-social a {
  color: #fff;
  font-size: 1.5rem;
  transition: color 0.3s;
}
.footer-social a:hover {
  color: #0af;
}
.dark-footer__bottom {
  margin-top: 20px;
  border-top: 1px solid #222;
  padding-top: 10px;
}
</style>
