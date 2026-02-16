const NaverScraper = require('./naver');

describe('NaverScraper Parsing logic', () => {
    let scraper;

    beforeEach(() => {
        scraper = new NaverScraper('test-id');
    });

    it('should extract review information correctly from spans', () => {
        const sampleSpans = [
            "2024.10.25",
            "점심에 방문",
            "예약 없이 이용",
            "친구",
            "영수증",
            "커피가 정말 맛있고 분위기가 좋아요.",
            "2024.10.26",
            "저녁에 방문",
            "대기 시간 바로 입장",
            "혼자",
            "디저트 맛집입니다. 다음에도 올게요!"
        ];

        const results = scraper.processSpans(sampleSpans);

        expect(results.length).toBe(2);

        // First review
        expect(results[0].date).toBe("2024.10.25");
        expect(results[0].visitTime).toBe("점심에 방문");
        expect(results[0].booking).toBe("예약 없이 이용");
        expect(results[0].purpose).toBe("친구");
        expect(results[0].reviewType).toBe("영수증 리뷰");
        expect(results[0].content).toContain("커피가 정말 맛있고");

        // Second review
        expect(results[1].date).toBe("2024.10.26");
        expect(results[1].visitTime).toBe("저녁에 방문");
        expect(results[1].waiting).toBe("바로 입장");
        expect(results[1].content).toContain("디저트 맛집입니다");
    });

    it('should ignore irrelevant keywords', () => {
        const sampleSpans = [
            "2024.01.01",
            "방문", "인증", "사진",
            "진짜 리뷰 내용입니다. 5글자 이상임"
        ];
        const results = scraper.processSpans(sampleSpans);
        expect(results[0].content.trim()).toBe("진짜 리뷰 내용입니다. 5글자 이상임");
    });
});
