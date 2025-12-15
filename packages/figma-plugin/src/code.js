"use strict";
// 블로그 글 패턴: figma.showUI로 UI 표시
figma.showUI('', { width: 400, height: 600 });
// 블로그 글 패턴: figma.ui.onmessage로 UI에서 메시지 수신
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'export-icon') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.ui.postMessage({
                type: 'error',
                message: '아이콘을 선택해주세요.',
            });
            return;
        }
        const node = selection[0];
        if (node.type !== 'VECTOR' && node.type !== 'COMPONENT' && node.type !== 'INSTANCE') {
            figma.ui.postMessage({
                type: 'error',
                message: '벡터, 컴포넌트, 또는 인스턴스를 선택해주세요.',
            });
            return;
        }
        try {
            // SVG로 export
            const svg = await node.exportAsync({ format: 'SVG' });
            const svgString = new TextDecoder().decode(svg);
            // 노드 이름에서 정보 추출
            const nodeName = node.name;
            const iconName = `icon/${nodeName.toLowerCase().replace(/\s+/g, '/')}`;
            // 블로그 글 패턴: figma.ui.postMessage로 UI에 메시지 전송
            figma.ui.postMessage({
                type: 'icon-exported',
                data: {
                    name: iconName,
                    svg: svgString,
                    nodeName: nodeName,
                },
            });
        }
        catch (error) {
            figma.ui.postMessage({
                type: 'error',
                message: `Export 실패: ${error}`,
            });
        }
    }
    if (msg.type === 'close') {
        figma.closePlugin();
    }
};
