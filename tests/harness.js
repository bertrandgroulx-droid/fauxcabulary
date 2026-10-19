// The one DOM stub every suite drives the real page script through.
//
// The page carries two inline scripts: the github.io redirect at the top of
// <head>, and the game itself after words.js and shozbot-daily.js. The suites
// used to grab the first <script> block, which became the redirect the day it
// was added — so this picks the block that follows the daily kit instead.
//
// boot(opts) runs the kit, the word bank and the game in one scope and returns
// the elements the game touched. Options:
//   store     an object to use as localStorage (keys in, keys out)
//   search    the address's query, e.g. "?practice" or "?daily=2026-10-12"
//   now       the date "today" should be: "YYYY-MM-DD", fixed at local noon
//   Audio     a constructor to stand in for Audio, to see what the page loads
//   navigator what the page sees as navigator (share, clipboard)
//   canonical the href of the page's canonical link, for the share icon
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..') + '/';

const words = fs.readFileSync(ROOT + 'words.js', 'utf8');
const kit = fs.readFileSync(ROOT + 'shozbot-daily.js', 'utf8');
const html = fs.readFileSync(ROOT + 'index.html', 'utf8');
const MARK = '<script src="shozbot-daily.js"></script>\n<script>\n';
if (!html.includes(MARK)) throw new Error('index.html no longer loads shozbot-daily.js before the game script');
const script = html.split(MARK)[1].split('</script>')[0];

const bank = new Function(words + '; return { r: REAL_WORDS, k: FAKE_WORDS };')();

function makeEl(id) {
  const set = new Set();
  return {
    id, textContent: '', innerHTML: '', disabled: false, className: '', hidden: false,
    classList: {
      add: c => set.add(c), remove: c => set.delete(c), contains: c => set.has(c),
      toggle: (c, on) => { on ? set.add(c) : set.delete(c); }
    },
    attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; }, removeAttribute(k) { delete this.attrs[k]; },
    handlers: {}, addEventListener(ev, fn) { this.handlers[ev] = fn; }, focus() {}
  };
}

function boot(opts) {
  opts = opts || {};
  const els = {};
  const store = opts.store || {};
  const docHandlers = {};
  const document = {
    getElementById: id => (els[id] = els[id] || makeEl(id)),
    // The one thing the page looks up by selector: its canonical link, which
    // the share icon builds the address from.
    querySelector: sel => (sel === 'link[rel="canonical"]' ? { href: opts.canonical || 'https://shozbot.com/fauxcabulary/' } : null),
    addEventListener: (ev, fn) => { docHandlers[ev] = fn; }
  };
  const localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    key: i => Object.keys(store)[i],
    get length() { return Object.keys(store).length; }
  };
  const location = {
    search: opts.search || '', protocol: 'https:', origin: 'https://shozbot.com',
    pathname: '/fauxcabulary/', hostname: 'shozbot.com'
  };
  const history = {
    urls: [],
    replaceState(_s, _t, url) { this.urls.push(url); location.search = url.charAt(0) === '?' ? url : ''; }
  };
  const Audio = opts.Audio || function () {
    this.play = () => ({ catch() {} }); this.pause = () => {}; this.currentTime = 0; this.preload = '';
  };
  let fixed = null;
  if (opts.now) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(opts.now);
    fixed = new Date(+m[1], +m[2] - 1, +m[3], 12).getTime();
  }
  class FakeDate extends Date {
    constructor(...a) { if (a.length) super(...a); else super(fixed === null ? Date.now() : fixed); }
    static now() { return fixed === null ? Date.now() : fixed; }
  }
  const window = { scrollTo() {}, prompt() {} };
  const navigator = opts.navigator || {};
  new Function('document', 'localStorage', 'window', 'navigator', 'location', 'history', 'Audio', 'Date',
    kit + '\n' + words + '\n' + script)
    (document, localStorage, window, navigator, location, history, Audio, FakeDate);
  return { els, store, location, history, window, docHandlers };
}

module.exports = { boot, bank, words, script, kit, makeEl };
