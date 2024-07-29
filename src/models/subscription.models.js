import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId, //the user who is subscribing
            ref: "User",
            require: true,
        },
        channel: {
            type: mongoose.Schema.Types.ObjectId, //the user who is being subscribed to
            ref: "User",
            require: true,
        },
    },
    { timestamps: true }
);

const Subscription =
    mongoose.models.Subscription ||
    mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
