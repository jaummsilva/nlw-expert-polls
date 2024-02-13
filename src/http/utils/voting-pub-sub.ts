type Message = { pollOptionId: string; votes: number };
type Subscriber = (message: Message) => void;

class VotingPubSub {
  private channels: Record<string, Subscriber[]> = {};

  subscribe(poolId: string, subscriber: Subscriber) {
    if (!this.channels[poolId]) {
      this.channels[poolId] = [];
    }
    this.channels[poolId].push(subscriber);
  }

  publish(poolId: string, message: Message) {
    if (!this.channels[poolId]) {
      return;
    }
    for (const subscriber of this.channels[poolId]) {
      subscriber(message);
    }
  }
}

export const voting = new VotingPubSub();
