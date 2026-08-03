import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { runInNewContext } from "node:vm";

const root = new URL("../", import.meta.url).pathname;
const ignored = new Set([".git", "docs", "products", "tests"]);
const deployedExtensions = new Set([".html", ".xml", ".js"]);

export function read(path) {
  return readFileSync(join(root, path), "utf8");
}

export function deployedFiles(directory = root) {
  return readdirSync(directory).flatMap((name) => {
    if (ignored.has(name)) return [];
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) return deployedFiles(absolute);
    return deployedExtensions.has(extname(name)) ? [relative(root, absolute)] : [];
  });
}

test("deployed copy contains no prohibited positioning", () => {
  const prohibited = [
    /patent/i,
    /flagship/i,
    /sole inventor/i,
    /sole engineer\s*(?:&|&amp;|&#0*38;|&#x0*26;)\s*inventor/i,
  ];
  const failures = [];
  for (const file of deployedFiles()) {
    const source = read(file);
    for (const pattern of prohibited) {
      if (pattern.test(source)) failures.push(`${file}: ${pattern}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("homepage is person-first and has exactly three featured projects", () => {
  const home = read("index.html");
  assert.match(home, /Nic Albertson · Full-stack \/ product engineer/);
  assert.match(home, /I turn messy workflows into <em>reliable software\.<\/em>/);
  assert.match(home, /Hiring a product engineer/);
  assert.match(home, /Need a system built/);
  const featured = [...home.matchAll(/class="asset featured-project/g)];
  assert.equal(featured.length, 3);
  const positions = ["BeyondMythos", "Tradewind DealFlow", "TaskFlow"].map((name) => home.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.doesNotMatch(home, /href="\/purchase\//);
});

test("homepage featured projects expose responsibility, stack, proof, and safe destinations", () => {
  const home = read("index.html");
  const cards = [...home.matchAll(/<article class="asset featured-project rv">([\s\S]*?)<\/article>/g)]
    .map((match) => match[1]);
  assert.equal(cards.length, 3);

  const cardFor = (name) => cards.find((card) => card.includes(`<h3>${name}</h3>`));
  const expectations = [
    ["BeyondMythos", "/case-studies/beyondmythos.html", /Git · Vercel · Stripe · provider APIs/],
    ["Tradewind DealFlow", "/case-studies/tradewind-dealflow.html", /TypeScript · controlled storage · automated tests/],
    ["TaskFlow", "/case-studies/taskflow.html", /TypeScript · Node.js 22 · Web APIs/],
  ];

  for (const [name, caseStudy, stack] of expectations) {
    const card = cardFor(name);
    assert.ok(card, `${name} card`);
    assert.match(card, /<dt>Responsibility<\/dt><dd>[^<]+<\/dd>/, `${name} responsibility`);
    assert.match(card, /<dt>Stack<\/dt><dd>[^<]+<\/dd>/, `${name} stack`);
    assert.match(card, stack, `${name} named technology stack`);
    assert.match(card, /<dl class="specs">[\s\S]*<dt>Proof<\/dt>/, `${name} proof`);
    assert.match(card, new RegExp(`href="${caseStudy.replaceAll("/", "\\/")}"`), `${name} case study`);
  }

  const beyondMythos = cardFor("BeyondMythos");
  assert.match(beyondMythos, /href="https:\/\/beyondmythos\.com\/"[^>]*rel="noopener"/);

  const tradewind = cardFor("Tradewind DealFlow");
  assert.doesNotMatch(tradewind, /href="https?:\/\//);
  assert.match(tradewind, /Private system · no public demo/);

  const taskflow = cardFor("TaskFlow");
  assert.doesNotMatch(taskflow, /href="https?:\/\//);
  assert.match(taskflow, /Private source · case study available/);
});

test("homepage metadata is role-first", () => {
  const home = read("index.html");
  assert.match(home, /<title>Nic Albertson — Full-Stack \/ Product Engineer<\/title>/);
  assert.match(home, /Product-minded full-stack engineer building reliable workflow automation/);
  assert.match(home, /"jobTitle": "Full-Stack \/ Product Engineer"/);
  assert.doesNotMatch(home, /revenue-ready|20\+|acquisition/i);
});

test("required routes and focused services exist", () => {
  for (const path of [
    "case-studies/beyondmythos.html",
    "case-studies/tradewind-dealflow.html",
    "resume/index.html",
  ]) assert.equal(existsSync(join(root, path)), true, path);
  const services = read("services/index.html");
  assert.match(services, /Product and Systems Audit/);
  assert.match(services, /Fixed-Scope Build Sprint/);
  const offers = [...services.matchAll(/<article class="tier(?: flag)?"/g)];
  assert.equal(offers.length, 2);
  assert.doesNotMatch(services, /Fractional Founding Engineer|Source License|Acquisition|checkout|buy now|payment|invoice|add to cart|pricing/i);
  assert.equal(existsSync(join(root, "assets/commerce-config.js")), false);
});

test("BeyondMythos copy distinguishes operations from traction", () => {
  const page = read("case-studies/beyondmythos.html");
  assert.match(page, /Autonomous Deployment Engine/);
  assert.match(page, /41/);
  assert.match(page, /operational evidence/i);
  assert.match(page, /not (customer|market) traction/i);
});

test("shared behavior has no checkout enhancer and supports inquiry and print", () => {
  const script = read("assets/site.js");
  assert.doesNotMatch(script, /purchase route|begin_checkout|commerceEnhanced/);
  assert.match(script, /data-inquiry-form/);
  assert.match(script, /data-print-resume/);
  assert.match(script, /Escape/);
});

test("mobile navigation removes closed links from interaction and restores toggle focus", () => {
  const listeners = () => {
    const registered = new Map();
    return {
      addEventListener(type, listener) {
        if (!registered.has(type)) registered.set(type, []);
        registered.get(type).push(listener);
      },
      dispatch(type, event = {}) {
        for (const listener of registered.get(type) || []) listener({ type, ...event });
      },
    };
  };
  const element = () => {
    const target = listeners();
    const attributes = new Map();
    const classes = new Set();
    return Object.assign(target, {
      inert: false,
      focused: false,
      classList: {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
        contains: (name) => classes.has(name),
        toggle(name, force) {
          const enabled = force === undefined ? !classes.has(name) : force;
          if (enabled) classes.add(name);
          else classes.delete(name);
          return enabled;
        },
      },
      setAttribute: (name, value) => attributes.set(name, String(value)),
      getAttribute: (name) => attributes.get(name),
      removeAttribute: (name) => attributes.delete(name),
      focus() { this.focused = true; },
      querySelectorAll: () => [],
    });
  };

  const toggle = element();
  toggle.setAttribute("aria-expanded", "false");
  const navigation = element();
  const link = element();
  navigation.querySelectorAll = (selector) => selector === "a" ? [link] : [];

  const mobileQuery = Object.assign(listeners(), { matches: true });
  const reducedMotionQuery = Object.assign(listeners(), { matches: false });
  const documentTarget = Object.assign(listeners(), {
    querySelector: (selector) => ({ ".nav-toggle": toggle, ".nav-links": navigation }[selector] || null),
    querySelectorAll: () => [],
  });
  const windowTarget = Object.assign(listeners(), {
    matchMedia: (query) => query === "(max-width: 760px)" ? mobileQuery : reducedMotionQuery,
  });
  class Observer {
    observe() {}
    unobserve() {}
  }

  runInNewContext(read("assets/site.js"), {
    document: documentTarget,
    window: windowTarget,
    IntersectionObserver: Observer,
    FormData: class {},
    navigator: {},
    encodeURIComponent,
    setTimeout: () => 0,
  });

  assert.equal(navigation.inert, true);
  assert.equal(navigation.getAttribute("aria-hidden"), "true");

  toggle.dispatch("click");
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(navigation.inert, false);
  assert.equal(navigation.getAttribute("aria-hidden"), undefined);

  link.dispatch("click");
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(navigation.inert, true);

  toggle.dispatch("click");
  documentTarget.dispatch("keydown", { key: "Escape" });
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(navigation.inert, true);
  assert.equal(toggle.focused, true);

  mobileQuery.matches = false;
  mobileQuery.dispatch("change");
  assert.equal(navigation.inert, false);
  assert.equal(navigation.getAttribute("aria-hidden"), undefined);
});

test("mobile navigation toggle is 44 by 44 pixels at the menu breakpoint", () => {
  const styles = read("assets/style.css");
  const menuMediaStart = styles.indexOf("@media(max-width:760px){");
  const menuMediaEnd = styles.indexOf("\n}\n", menuMediaStart) + 2;
  const menuRules = styles.slice(menuMediaStart, menuMediaEnd);
  assert.match(menuRules, /\.nav-toggle\{[^}]*width:44px;height:44px/);
  assert.match(menuRules, /\.nav-links\{[^}]*visibility:hidden/);
  assert.match(menuRules, /\.nav-links\.open\{[^}]*visibility:visible/);
});

test("selected case studies use evidence-backed framing", () => {
  const index = read("case-studies/index.html");
  const positions = ["BeyondMythos", "Tradewind DealFlow", "TaskFlow"].map((name) => index.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  const taskflow = read("case-studies/taskflow.html");
  assert.match(taskflow, /retries/i);
  assert.match(taskflow, /persistence/i);
  assert.match(taskflow, /tests/i);
  assert.doesNotMatch(taskflow, /36K|30 files/i);
  const experiment = read("case-studies/constellation-coo.html");
  assert.match(experiment, /Experimental agent-scheduling engine/);
  assert.match(experiment, /synthetic benchmark/i);
});

test("StoreForge uses an implementation status rather than sale positioning", () => {
  const storeforge = read("case-studies/storeforge.html");
  const status = storeforge.match(/<dt>Status<\/dt><dd class="hl">([^<]+)<\/dd>/)?.[1];
  assert.equal(status, "Platform implemented");
  assert.doesNotMatch(storeforge, /Acquisition asset/i);
});

test("secondary navigation uses the homepage Contact destination", () => {
  const failures = [];
  for (const file of deployedFiles().filter((path) => path.endsWith(".html") && path !== "index.html")) {
    const source = read(file);
    const navigation = source.match(/<nav(?:\s[^>]*)?>[\s\S]*?<\/nav>/)?.[0];
    if (!navigation) continue;
    if (!/href="\/#contact" class="nav-cta">Contact<\/a>/.test(navigation)) failures.push(file);
  }
  assert.deepEqual(failures, []);
});

test("purchase route is a transparent project inquiry", () => {
  const inquiry = read("purchase/index.html");
  assert.match(inquiry, /<title>Project Inquiry \| Nic Albertson<\/title>/);
  assert.match(inquiry, /Tell me what is slowing the team down/);
  assert.match(inquiry, /data-inquiry-form/);
  for (const name of ["name", "email", "company", "current-system", "users", "problem", "outcome", "timeline"]) {
    assert.match(inquiry, new RegExp(`name="${name}"`));
  }
  assert.match(inquiry, /opens your email app/i);
  assert.match(inquiry, /Nothing is sent or stored by this website\./);
  assert.match(inquiry, /href="mailto:hello@fullstackassets\.com">hello@fullstackassets\.com<\/a>/);
  assert.doesNotMatch(inquiry, /checkout|payment|invoice|purchase audit/i);
});

test("resume is factual, printable, and linked", () => {
  const resume = read("resume/index.html");
  assert.match(resume, /Nic Albertson/);
  assert.match(resume, /Full-Stack \/ Product Engineer/);
  assert.match(resume, /Fall River, Massachusetts/);
  assert.match(resume, /BeyondMythos/);
  assert.match(resume, /Tradewind DealFlow/);
  assert.match(resume, /TaskFlow/);
  assert.match(resume, /41 deployed sites/);
  assert.match(resume, /14 mapped domains/);
  assert.match(resume, /hourly workflows/);
  assert.match(resume, /operational evidence, not customer or market traction/i);
  assert.match(resume, /data-print-resume/);
  assert.doesNotMatch(resume, /work authorization|Bachelor|revenue|customers/i);
});

test("discovery files expose the new portfolio hierarchy", () => {
  const sitemap = read("sitemap.xml");
  for (const route of [
    "/case-studies/beyondmythos.html",
    "/case-studies/tradewind-dealflow.html",
    "/resume/",
  ]) assert.match(sitemap, new RegExp(route.replaceAll("/", "\\/")));
  assert.doesNotMatch(sitemap, /patents-for-indie-engineers|\/purchase\//i);
  const feed = read("blog/feed.xml");
  const lastBuildDate = feed.match(/<lastBuildDate>([^<]+)<\/lastBuildDate>/)?.[1];
  assert.equal(lastBuildDate, "Sun, 02 Aug 2026 00:00:00 GMT");
  assert.equal(Number.isNaN(Date.parse(lastBuildDate)), false);
  assert.doesNotMatch(feed, /patent|20\+|already for sale/i);
  assert.equal(existsSync(join(root, "blog/patents-for-indie-engineers.html")), false);
});

test("VERITAS routes its shared project CTA to the inquiry", () => {
  const veritas = read("case-studies/veritas.html");
  assert.match(veritas, /href="\/services\/#inquiry">Discuss a project<\/a>/);
  assert.doesNotMatch(veritas, /Commission an eval build|\/services\/#engagements/);
});
