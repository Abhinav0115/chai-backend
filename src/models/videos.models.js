import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String,
            require: true,
        },
        thumbnail: {
            type: String,
            require: true,
        },
        title: {
            type: String,
            require: true,
        },
        description: {
            type: String,
            require: true,
        },
        duration: {
            type: Number, //from cloudinary
            require: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            require: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            require: true,
        },
    },
    { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

export default Video;
