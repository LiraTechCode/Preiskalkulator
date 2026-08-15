export const SITE_CONFIG = Object.freeze({
  bookingLink: "https://cal.com/finn-schulte/30min",
  contactEmail: "finn@liratech.de",
  pricing: Object.freeze({
    currency: "EUR",
    priceLabel: "Budgetindikation",
    taxNotice: ""
  }),
  calculatorLeadEndpoint: null
});

export function applySiteConfig(root = document) {
  root.querySelectorAll(".js-booking-link").forEach((link) => {
    link.setAttribute("href", SITE_CONFIG.bookingLink);
  });

  root.querySelectorAll(".js-contact-email").forEach((link) => {
    link.setAttribute("href", `mailto:${SITE_CONFIG.contactEmail}`);
    link.textContent = SITE_CONFIG.contactEmail;
  });

  root.querySelectorAll(".js-current-year, #year").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
}
