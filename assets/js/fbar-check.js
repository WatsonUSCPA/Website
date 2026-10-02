/* =============================================================
 * Watson US CPA — FBAR / Form 8938 quick check (homepage, JP & EN)
 * Thresholds per IRS "Comparison of Form 8938 and FBAR requirements"
 * and "Do I need to file Form 8938?" (irs.gov). Simplified guide only.
 *   FBAR: foreign accounts over $10,000 in aggregate at any time.
 *   8938: single in the U.S. $50k year-end / $75k any time;
 *         single abroad $200k / $300k; joint filers double.
 * Runs entirely in the browser; nothing is sent anywhere.
 * Link targets come from data-* attributes on #fbar-check.
 * ============================================================= */
(function () {
  "use strict";
  var box = document.getElementById("fbar-check");
  if (!box) return;
  var EN = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
  var steps = box.querySelectorAll(".fc-step");
  var resultEl = document.getElementById("fc-result");
  var progress = document.getElementById("fc-progress");
  var backBtn = box.querySelector('[data-action="back"]');
  var restartBtn = box.querySelector('[data-action="restart"]');
  var TOTAL = 5, state = {}, history = [];
  var CONSULT = box.getAttribute("data-consult") || "contact/";
  var ARTICLE = box.getAttribute("data-article") || "https://note.com/wtcajptc";
  var FULLTOOL = box.getAttribute("data-fulltool") || "";
  var T = { // [year-end, any time] in USD
    us:     { single: [50000, 75000],   mfj: [100000, 150000] },
    abroad: { single: [200000, 300000], mfj: [400000, 600000] }
  };
  function t(ja, en) { return EN ? en : ja; }
  function usd(n) { return "$" + Number(n).toLocaleString("en-US"); }
  function num(id) {
    var v = (document.getElementById(id).value || "").replace(/[^0-9.]/g, "");
    return v === "" ? null : parseFloat(v);
  }
  function show(n, focus) {
    steps.forEach(function (s) { s.hidden = String(s.getAttribute("data-step")) !== String(n); });
    resultEl.hidden = n !== "result";
    backBtn.hidden = history.length === 0;
    restartBtn.hidden = history.length === 0;
    progress.textContent = n === "result" ? t("結果", "Result") : t("質問 " + n + " / " + TOTAL, "Question " + n + " of " + TOTAL);
    box.setAttribute("data-current", n);
    if (focus) {
      var target = n === "result" ? resultEl : box.querySelector('.fc-step[data-step="' + n + '"] .fc-q');
      if (target) { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
    }
  }
  function go(next) { history.push(box.getAttribute("data-current")); show(next, true); }

  function row(label, verdict, cls, body) {
    return '<div class="fc-row ' + cls + '"><p class="fc-row-head"><strong>' + label + '</strong><span class="fc-verdict">' +
      verdict + '</span></p><p>' + body + '</p></div>';
  }
  function actions() {
    var html = '<div class="fc-result-actions">' +
      '<a class="btn btn-primary" href="' + CONSULT + '">' + t("スポット相談で確認する", "Check it in a consultation") + '</a>' +
      '<a class="btn btn-ghost" href="' + ARTICLE + '" target="_blank" rel="noopener">' +
      t("note で FBAR と 8938 の違いを読む", "Read: FBAR vs. Form 8938 on note (Japanese)") + '</a>';
    if (FULLTOOL) {
      html += '<a class="btn btn-ghost" href="' + FULLTOOL + '">' +
        t("詳しい判定（5471・8621 も）", "Detailed check (Japanese)") + '</a>';
    }
    return html + '</div>';
  }
  function render() {
    var html = "";
    if (state.status === "no") {
      html += '<p class="fc-summary">' + t("この回答の範囲では、FBAR・Form 8938 の対象にならない可能性が高いです。",
        "Based on these answers, FBAR and Form 8938 most likely don’t apply to you.") + '</p>';
      html += '<p>' + t("どちらも、米国市民・グリーンカード保持者・米国居住者などが対象です。ただし、年の途中で米国に移った・米国を離れた場合や、夫婦合算申告を選ぶ場合などは判定が変わることがあります。",
        "Both apply to U.S. citizens, green card holders, U.S. residents, and similar. The answer can change if you moved to or left the U.S. during the year, or elect to file jointly with a U.S. spouse.") + '</p>';
    } else if (state.status === "unsure") {
      html += '<p class="fc-summary">' + t("まず、米国の税務上の居住者にあたるかどうかの確認が必要です。",
        "The first step is to confirm whether you’re a U.S. resident for tax purposes.") + '</p>';
      html += '<p>' + t("グリーンカードの有無や、米国での滞在日数（実質的滞在テスト）などで決まります。居住者にあたる場合は、この先の質問に進んでください。",
        "It depends on things like green card status and days present in the U.S. (the substantial presence test). If you are a resident, go back and continue.") + '</p>';
    } else {
      if (state.fbar === "yes") {
        html += row("FBAR (FinCEN 114)", t("提出が必要な可能性が高い", "Likely required"), "is-yes",
          t("米国外の金融口座の合計が年間のどこかで $10,000 を超えた場合、FBAR の対象です。IRS ではなく FinCEN に電子提出します（通常 4 月 15 日期限、10 月 15 日まで自動延長）。",
            "If your foreign accounts together went over $10,000 at any time in the year, FBAR applies. It’s filed electronically with FinCEN, not the IRS (normally due April 15, automatically extended to October 15)."));
      } else if (state.fbar === "no") {
        html += row("FBAR (FinCEN 114)", t("この回答では不要の可能性", "Likely not required"), "is-no",
          t("合計が年間を通じて $10,000 以下なら、通常 FBAR は不要です。複数口座の合計や、為替の換算で超えていないかは確認しておくと安心です。",
            "If the combined total stayed at or below $10,000 all year, FBAR is usually not required. It’s worth double-checking the combined total and the currency conversion."));
      } else {
        html += row("FBAR (FinCEN 114)", t("要確認", "Check"), "is-check",
          t("各口座の年間最大残高を明細で確認し、合計して $10,000 を超えたかどうかを見ます。",
            "Look up each account’s highest balance for the year on your statements and add them together to see whether it went over $10,000."));
      }
      var th = T[state.res][state.filing];
      var basis = t((state.res === "us" ? "米国在住" : "米国外在住") + "・" + (state.filing === "mfj" ? "夫婦合算" : "単身など") +
          "の基準：年末 " + usd(th[0]) + " 超、または年間いずれかの時点で " + usd(th[1]) + " 超。",
        "Threshold for " + (state.filing === "mfj" ? "joint filers" : "single / non-joint filers") + " living " +
          (state.res === "us" ? "in the U.S." : "abroad") + ": over " + usd(th[0]) + " on the last day of the year, or over " + usd(th[1]) + " at any time.");
      if (state.end == null && state.max == null) {
        html += row("Form 8938", t("要確認", "Check"), "is-check", basis + t("年末時点と年間最大の合計額を確認してください。", " Check the year-end and highest totals."));
      } else {
        var over = (state.end != null && state.end > th[0]) || (state.max != null && state.max > th[1]);
        html += over
          ? row("Form 8938", t("提出が必要な可能性が高い", "Likely required"), "is-yes",
              basis + t("この金額は基準を超えています。Form 8938 は所得税の申告書（Form 1040）に添付して提出します。", " Your amounts are over it. Form 8938 is attached to your income tax return (Form 1040)."))
          : row("Form 8938", t("この回答では不要の可能性", "Likely not required"), "is-no",
              basis + t("入力された金額は基準以下です。", " The amounts you entered are at or below it."));
      }
      html += '<p class="fc-small">' + t("FBAR と Form 8938 は別々の手続きで、両方が必要になることもあります。所得税の申告義務がない年は Form 8938 は不要です。対象となる口座・資産の範囲も両者で異なります。",
        "FBAR and Form 8938 are separate, and you may need both. If you don’t have to file an income tax return for the year, you don’t need Form 8938. The accounts and assets each one covers also differ.") + '</p>';
    }
    html += actions();
    resultEl.innerHTML = html;
  }

  box.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || !box.contains(b)) return;
    var k = b.getAttribute("data-k"), v = b.getAttribute("data-v"), a = b.getAttribute("data-action");
    if (k) {
      state[k] = v;
      b.parentNode.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      var cur = Number(box.getAttribute("data-current"));
      if (k === "status" && v !== "yes") { render(); go("result"); return; }
      go(cur + 1);
    } else if (a === "amounts") {
      state.end = num("fc-end"); state.max = num("fc-max"); render(); go("result");
    } else if (a === "amounts-unknown") {
      state.end = null; state.max = null; render(); go("result");
    } else if (a === "back") {
      show(history.pop() || 1, true);
    } else if (a === "restart") {
      state = {}; history = [];
      box.querySelectorAll("input").forEach(function (i) { i.value = ""; });
      box.querySelectorAll(".fc-options [aria-pressed]").forEach(function (x) { x.removeAttribute("aria-pressed"); });
      show(1, true);
    }
  });
  // Enter in the amount fields = "See result"
  box.querySelectorAll(".fc-money input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); box.querySelector('[data-action="amounts"]').click(); }
    });
  });
  show(1, false);
})();
