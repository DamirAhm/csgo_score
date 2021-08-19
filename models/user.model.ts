import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema<SubscriptionDocument>(
	{
		name: {
			required: true,
			type: String,
		},
		steamId: {
			required: true,
			type: String,
		},
		active: {
			type: Boolean,
			default: true,
		},
		previousState: {
			type: String,
			default: null,
		},
	},
	{ _id: false }
);

const UserSchema = new mongoose.Schema<UserDocument>({
	id: {
		type: String,
		required: true,
		unique: true,
	},
	subscriptions: {
		type: [SubscriptionSchema],
		default: [],
	},
	name: String,
});

export interface User {
	id: string;
	subscriptions: SubscriptionDocument[];
	name?: string;
}
export interface UserDocument extends mongoose.Document, User {
	id: string;
}
export interface UserModelType extends mongoose.Model<UserDocument> {}

export interface Subscription {
	name: string;
	steamId: string;
	active: boolean;
	previousState: string | null;
}
export interface SubscriptionDocument extends mongoose.Document, Subscription {}

export default mongoose.model<UserDocument>('User', UserSchema);
