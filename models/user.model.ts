import mongoose from 'mongoose';

const UserDetailsSchema = new mongoose.Schema<UserDetailsDocument>({
    state: {
        type: String,
        required: true,
    },
    gameState: {
        type: String,
    },
    gameDetails: {
        type: String
    }
}, { _id: false });

const SubscriptionSchema = new mongoose.Schema<SubscriptionDocument>({
    name: {
        required: true,
        type: String
    },
    url: {
        required: true,
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    previousState: {
        type: UserDetailsSchema,
        default: null
    }
}, { _id: false });

const UserSchema = new mongoose.Schema<UserDocument>({
    id: {
        type: String,
        required: true,
        unique: true
    },
    subscriptions: {
        type: [SubscriptionSchema],
        default: []
    },
    name: String,
})


export interface User {
    id: string,
    subscriptions: SubscriptionDocument[],
    name?: string
}
export interface UserDocument extends mongoose.Document, User {
    id: string
}
export interface UserModelType extends mongoose.Model<UserDocument> { };

export interface Subscription {
    name: string,
    url: string,
    active: boolean,
    previousState: UserDetailsDocument | null
}
export interface SubscriptionDocument extends mongoose.Document, Subscription { }

export interface UserDetails {
    state: string,
    gameState?: string,
    gameDetails?: string
}
export interface UserDetailsDocument extends mongoose.Document, UserDetails {
}

export default mongoose.model<UserDocument>('User', UserSchema);