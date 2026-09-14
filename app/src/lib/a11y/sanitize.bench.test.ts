// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { LABS } from '$lib/content';
import { labHtml, sanitizeLabHtml } from './sanitize';

function authoredHtml(lab: (typeof LABS)[number]): string[] {
	const out: string[] = [];
	for (const step of lab.steps) {
		out.push(step.do, step.teach);
		if (step.hint) out.push(step.hint);
		if (step.miss) out.push(step.miss);
	}
	return out;
}

function textOf(html: string): string {
	return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '\u00a0');
}

describe('sanitizeLabHtml', () => {
	it('keeps lang=ko spans and lab formatting', () => {
		const html =
			'<p>Say <span lang="ko">ㄱ</span> slowly. <span class="jamo">ㅁ</span> <em>mmm</em></p>';
		expect(sanitizeLabHtml(html)).toBe(html);
	});

	it('keeps hg and rom classes used in teach copy', () => {
		const html = '<p><span class="hg">밥</span> <span class="rom">bap</span></p>';
		expect(sanitizeLabHtml(html)).toBe(html);
	});

	it('strips scripts, event handlers, and unknown tags', () => {
		const dirty =
			'<p>ok</p><script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">x</a>';
		const clean = sanitizeLabHtml(dirty);
		expect(clean).not.toMatch(/<script/i);
		expect(clean).not.toMatch(/onerror/i);
		expect(clean).not.toMatch(/<img/i);
		expect(clean).not.toMatch(/<a /i);
		expect(clean).toContain('ok');
	});

	it('drops classes that lab CSS does not use', () => {
		expect(sanitizeLabHtml('<span class="jamo evil">ㄱ</span>')).toBe(
			'<span class="jamo">ㄱ</span>'
		);
	});
});

describe('labHtml', () => {
	it('wraps Hangul then keeps the lang=ko span', () => {
		expect(labHtml('<p>Say ㄱ slowly</p>')).toBe(
			'<p>Say <span lang="ko">ㄱ</span> slowly</p>'
		);
	});

	it('does not strip authored lab copy or formatting classes', () => {
		for (const lab of LABS) {
			for (const html of authoredHtml(lab)) {
				const out = labHtml(html);
				expect(textOf(out)).toBe(textOf(html));
				expect((out.match(/class="jamo"/g) ?? []).length).toBe(
					(html.match(/class="jamo"/g) ?? []).length
				);
				expect((out.match(/class="hg"/g) ?? []).length).toBe(
					(html.match(/class="hg"/g) ?? []).length
				);
				expect((out.match(/class="rom"/g) ?? []).length).toBe(
					(html.match(/class="rom"/g) ?? []).length
				);
			}
		}
	});
});

describe('benchmark labHtml', () => {
  it('bench', () => {
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      for (const lab of LABS) {
        for (const html of authoredHtml(lab)) {
          labHtml(html);
        }
      }
    }
    const duration = performance.now() - start;
    console.log('100 iterations of labHtml on all authored copy took:', duration.toFixed(2), 'ms');
  });
});
