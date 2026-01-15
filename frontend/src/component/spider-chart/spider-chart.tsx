import React from "react";
import { Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";
import "./style.css";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RadarChartComponent = () => {
    const data = {
        labels: ["구독자 성장율", "구독자 충성도", "인게이지먼트 비율", "채널 품질", "콘텐츠 제작 빈도"],
        datasets: [
            {
                label: "지표",
                data: [3, 5, 4, 4, 4],
                backgroundColor: "rgba(0, 207, 255, 0.25)",
                borderColor: "#00CFFF",
                borderWidth: 2,
                pointBackgroundColor: "#00CFFF",
                pointRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: {
                    color: "#e5e5e5",
                },
                // grid: {
                //     color: (context: any) => {
                //         // Alternate gray and white rings for background layers
                //         return context.index % 2 === 0 ? "#F7F7F7" : "#FFFFFF";
                //     },
                // },
                suggestedMin: 0,
                suggestedMax: 5,
                ticks: {
                    display: false,
                    stepSize: 1, // ✅ 0~5까지 1씩 증가 → 5개의 레이어
                },
                pointLabels: {
                    color: "#999999",
                    font: { size: 14 },
                },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: true,
            },
        },
        elements: {
            line: {
                borderWidth: 2,
            },
        },
        interaction: {
            mode: undefined, // Disable hover/click highlight borders
        },
    };

    return (
        <div style={{ width: "350px", height: "220px" }}>
            <Radar data={data} options={options} />
        </div>
    );
};

export default RadarChartComponent;