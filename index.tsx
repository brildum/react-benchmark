import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as stats from 'stats-lite';

const MAX_EXECUTIONS = 100;

interface TestCase {
  start(onComplete: () => void): void;
}

class TestRunner {
  private test: TestCase;
  private callback: (benchmarks: number[]) => void;
  private benchmarks: number[] = [];
  private executionStartTime = 0;

  constructor(test: TestCase, onComplete: (benchmarks: number[]) => void) {
    this.test = test;
    this.callback = onComplete;
  }

  public start() {
    this.runTest();
  }

  private runTest() {
    this.executionStartTime = window.performance.now();
    this.test.start(this.onComplete);
  }

  private onComplete = () => {
    const endTime = window.performance.now();
    const duration = endTime - this.executionStartTime;
    this.benchmarks.push(duration);
    if (this.benchmarks.length === MAX_EXECUTIONS) {
      this.callback(this.benchmarks);
      return;
    }
    this.runTest();
  }
}

interface State {
  count: number;
}

class BenchmarkTest extends React.Component<{}, State> implements TestCase {
  public state = {
    count: 0,
  };
  private callback: () => void | null;

  public render() {
    return <h1>Hello {this.state.count}</h1>;
  }

  public start(onComplete: () => void) {
    this.callback = onComplete;
    this.setState({ count: 0 });
    setTimeout(this.update, 0);
  }

  private update = () => {
    if (this.state.count === 100) {
      this.callback();
      return;
    }

    this.setState({
      count: this.state.count + 1,
    });
    setTimeout(this.update, 0);
  }
}

interface BenchmarkState {
  hasResults: boolean;
  iter: number;
  mean: number;
  median: number;
}

class Benchmark extends React.Component<{}, BenchmarkState> {
  public state = {
    hasResults: false,
    iter: 0,
    mean: 0,
    median: 0,
  };

  public render() {
    if (this.state.hasResults) {
      return (
        <table>
          <tr>
            <td>Iterations</td><td>{this.state.iter}</td>
          </tr>
          <tr>
            <td>Mean</td><td>{this.state.mean}</td>
          </tr>
          <tr>
            <td>Median</td><td>{this.state.median}</td>
          </tr>
        </table>
      );
    }

    return this.props.children;
  }

  public publish(benchmarks: number[]) {
    this.setState({
      hasResults: true,
      iter: benchmarks.length,
      mean: stats.mean(benchmarks),
      median: stats.median(benchmarks),
    });
  }
}

const bench = React.createRef<Benchmark>();
const test = React.createRef<BenchmarkTest>();
ReactDOM.render(
  <Benchmark ref={bench}>
    <BenchmarkTest ref={test}/>
  </Benchmark>,
  document.getElementById('root'),
);

const runner = new TestRunner(test.current, (benchmarks: number[]) => {
  bench.current.publish(benchmarks);
});
setTimeout(() => {
  runner.start();
}, 1000);
