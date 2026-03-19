import { useState } from "react";
import { add, divide, multiply, subtract } from "./index.ts";

type Operator = "+" | "-" | "×" | "÷";

const operations: Record<Operator, (a: number, b: number) => number> = {
	"+": add,
	"-": subtract,
	"×": multiply,
	"÷": divide,
};

export function App() {
	const [display, setDisplay] = useState("0");
	const [firstOperand, setFirstOperand] = useState<number | null>(null);
	const [operator, setOperator] = useState<Operator | null>(null);
	const [waitingForSecond, setWaitingForSecond] = useState(false);

	function inputDigit(digit: string) {
		if (waitingForSecond) {
			setDisplay(digit);
			setWaitingForSecond(false);
		} else {
			setDisplay(display === "0" ? digit : display + digit);
		}
	}

	function inputDecimal() {
		if (waitingForSecond) {
			setDisplay("0.");
			setWaitingForSecond(false);
			return;
		}
		if (!display.includes(".")) {
			setDisplay(display + ".");
		}
	}

	function handleOperator(nextOp: Operator) {
		const current = Number.parseFloat(display);

		if (firstOperand !== null && operator && !waitingForSecond) {
			try {
				const result = operations[operator](firstOperand, current);
				const resultStr = String(result);
				setDisplay(resultStr);
				setFirstOperand(result);
			} catch {
				setDisplay("Error");
				setFirstOperand(null);
				setOperator(null);
				setWaitingForSecond(false);
				return;
			}
		} else {
			setFirstOperand(current);
		}

		setOperator(nextOp);
		setWaitingForSecond(true);
	}

	function calculate() {
		if (firstOperand === null || operator === null) return;

		const current = Number.parseFloat(display);
		try {
			const result = operations[operator](firstOperand, current);
			setDisplay(String(result));
			setFirstOperand(null);
			setOperator(null);
			setWaitingForSecond(true);
		} catch {
			setDisplay("Error");
			setFirstOperand(null);
			setOperator(null);
			setWaitingForSecond(false);
		}
	}

	function clear() {
		setDisplay("0");
		setFirstOperand(null);
		setOperator(null);
		setWaitingForSecond(false);
	}

	function toggleSign() {
		setDisplay(String(-Number.parseFloat(display)));
	}

	function percent() {
		setDisplay(String(Number.parseFloat(display) / 100));
	}

	const btn =
		"flex items-center justify-center rounded-full text-2xl font-light h-16 transition-colors active:brightness-75 cursor-pointer select-none";

	return (
		<div className="flex min-h-screen items-center justify-center bg-black">
			<div className="w-80">
				<div className="mb-2 px-4 text-right text-5xl font-light text-white truncate">
					{display}
				</div>

				<div className="grid grid-cols-4 gap-3">
					<button
						type="button"
						onClick={clear}
						className={`${btn} bg-neutral-400 text-black`}
					>
						{firstOperand !== null || operator !== null ? "C" : "AC"}
					</button>
					<button
						type="button"
						onClick={toggleSign}
						className={`${btn} bg-neutral-400 text-black`}
					>
						±
					</button>
					<button
						type="button"
						onClick={percent}
						className={`${btn} bg-neutral-400 text-black`}
					>
						%
					</button>
					<button
						type="button"
						onClick={() => handleOperator("÷")}
						className={`${btn} ${operator === "÷" && waitingForSecond ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}
					>
						÷
					</button>

					{["7", "8", "9"].map((d) => (
						<button
							key={d}
							type="button"
							onClick={() => inputDigit(d)}
							className={`${btn} bg-neutral-700 text-white`}
						>
							{d}
						</button>
					))}
					<button
						type="button"
						onClick={() => handleOperator("×")}
						className={`${btn} ${operator === "×" && waitingForSecond ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}
					>
						×
					</button>

					{["4", "5", "6"].map((d) => (
						<button
							key={d}
							type="button"
							onClick={() => inputDigit(d)}
							className={`${btn} bg-neutral-700 text-white`}
						>
							{d}
						</button>
					))}
					<button
						type="button"
						onClick={() => handleOperator("-")}
						className={`${btn} ${operator === "-" && waitingForSecond ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}
					>
						−
					</button>

					{["1", "2", "3"].map((d) => (
						<button
							key={d}
							type="button"
							onClick={() => inputDigit(d)}
							className={`${btn} bg-neutral-700 text-white`}
						>
							{d}
						</button>
					))}
					<button
						type="button"
						onClick={() => handleOperator("+")}
						className={`${btn} ${operator === "+" && waitingForSecond ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}
					>
						+
					</button>

					<button
						type="button"
						onClick={() => inputDigit("0")}
						className={`${btn} col-span-2 justify-start pl-7 bg-neutral-700 text-white`}
					>
						0
					</button>
					<button
						type="button"
						onClick={inputDecimal}
						className={`${btn} bg-neutral-700 text-white`}
					>
						.
					</button>
					<button
						type="button"
						onClick={calculate}
						className={`${btn} bg-orange-500 text-white`}
					>
						=
					</button>
				</div>
			</div>
		</div>
	);
}
