import paginate from "./paginate";

import Page from "./Page/page";
import Viewer from "./Viewer/viewer";
import Controls from "./Controls/controls";

import Rules from "./Rules/";


const DEFAULT_PAGE_SIZE = {
  width: 300,
  height: 400
}
const DEFAULT_PAGE_MARGIN = {
  inner: 30,
  outer: 50,
  bottom: 60,
  top: 40
}

class Binder {
  constructor(opts) {

    let pageSize = opts.pageSize ? opts.pageSize : DEFAULT_PAGE_SIZE
    let pageMargin = opts.pageMargin ? opts.pageMargin : DEFAULT_PAGE_MARGIN
    this.setSize(pageSize);
    this.setMargin(pageMargin);

    this.viewer = new Viewer()
    this.rules = [];

    if (opts.rules) this.addRules(opts.rules);
    if (opts.standalone) { this.runImmeditately = true; }
    this.debugDelay = opts.debugDelay ? opts.debugDelay : 0;

    if (!opts.source) {
      this.viewer.displayError("Source not specified", "You must include a source element, selector, or url");
      console.error(`Bindery: You must include a source element or selector`);
    }
    else if (typeof opts.source == "string") {
      this.source = document.querySelector(opts.source);
      if (!(this.source instanceof HTMLElement)) {
        this.viewer.displayError("Source not specified", `Could not find element that matches selector "${opts.source}"`);
        console.error(`Bindery: Could not find element that matches selector "${opts.source}"`);
        return
      }
      if (this.runImmeditately) {
        this.makeBook();
      }
    }
    else if (typeof opts.source == "object" && opts.source.url) {
      let url = opts.source.url;
      let selector = opts.source.selector;
      fetch(opts.source.url).then((response) => {
        console.log(response);
        if (response.status === 404) {
          this.viewer.displayError("404", `Could not find file at "${url}"`);
        }
        else if (response.status === 200) {
          return response.text();
        }
      }).then((fetchedContent) => {
        var wrapper = document.createElement('div');
        wrapper.innerHTML = fetchedContent;
        this.source = wrapper.querySelector(selector);
        if (!(this.source instanceof HTMLElement)) {
          this.viewer.displayError("Source not specified", `Could not find element that matches selector "${selector}"`);
          console.error(`Bindery: Could not find element that matches selector "${selector}"`);
          return
        }
        if (this.runImmeditately) {
          this.makeBook();
        }
      }).catch((error) => {
  			console.log(error);
        let scheme = window.location.href.split("://")[0];
        if (scheme == "file") {
          this.viewer.displayError(`Can't fetch content from "${url}"`, "Web pages can't fetch content unless they are on a server.");
          // alert(`Can't fetch content from "${url}". Web pages can't fetch content unless they are on a server. \n\n What you can do: \n 1. Include the content you need on this page, or \n 2. Put this page on your server, or \n 3. Run a local server`);
        }
  		});
    }
    else if (opts.source instanceof HTMLElement) {
      this.source = opts.source;
      if (this.runImmeditately) {
        this.makeBook();
      }
    }
    else {
      console.error(`Bindery: Source must be an element or selector`);
    }

  }

  cancel() {
    this.stopCheckingLayout();
    this.viewer.cancel();
    document.body.classList.remove("bindery-viewing");
    this.source.style.display = "";
  }

  setSize(size) {
    this.pageSize = size
    Page.setSize(size);
  }

  setMargin(margin) {
    this.pageMargin = margin
    Page.setMargin(margin);
  }

  isSizeValid() {
    return Page.isSizeValid();
  }

  addRules(newRules) {
    newRules.forEach((rule) => {
      if (rule instanceof Rules.BinderyRule) {
        this.rules.push(rule);
      }
      else {
        console.warn("Bindery: The following is not an instance of BinderyRule and will be ignored:");
        console.warn(rule);
      }
    })
  }

  makeBook(doneBinding) {

    if (!binder.source) {
      document.body.classList.add("bindery-viewing");
      return;      
    }

    if (!this.isSizeValid()) {
      console.error("Bindery: Cancelled pagination. Page is too small.");
      return;
    }

    this.stopCheckingLayout();

    this.source.style.display = "";
    let content = this.source.cloneNode(true);
    this.source.style.display = "none";

    // In case we're updating an existing layout
    document.body.classList.remove("bindery-viewing");
    document.body.classList.add("bindery-inProgress");

    if (!this.controls) {
      this.controls = new Controls({binder: this});
    }

    this.controls.setInProgress();

    paginate(content, this.rules, (pages) => {

      setTimeout(() => {
        this.viewer.pages = pages,
        this.viewer.update();

        this.controls.setDone();
        if (doneBinding) doneBinding();
        document.body.classList.remove("bindery-inProgress");
        this.startCheckingLayout()

      }, 100);



    }, this.debugDelay);
  }

  startCheckingLayout() {
    this.layoutChecker = setInterval(() => {
      this.checkLayoutChange()
    }, 500);
  }
  stopCheckingLayout() {
    if (this.layoutChecker) {
      clearInterval(this.layoutChecker);
      this.pageOverflows = null;
    }
  }

  checkLayoutChange() {
    if ( this.view.mode == "preview") return;
    if ( !this.pageOverflows) {
      this.pageOverflows = this.getPageOverflows();
      return;
    }
    else {
      let newOverflows = this.getPageOverflows();
      if (!arraysEqual(newOverflows, this.pageOverflows)) {
        // console.info("Layout changed");
        this.throttledUpdateBook()
        this.pageOverflows = newOverflows;
      }
    }
  }

  throttledUpdateBook() {
    if (this.makeBookTimer) clearTimeout(this.makeBookTimer);
    this.makeBookTimer = setTimeout(() => {
      this.makeBook()
    }, 500)
  }

  getPageOverflows() {
    return this.viewer.pages.map((page) => page.overflowAmount())
  }

}

let arraysEqual = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}


for (let rule in Rules) {
  Binder[rule] = Rules[rule];
}

module.exports = Binder;
