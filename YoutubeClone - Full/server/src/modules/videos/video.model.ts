import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { User } from "../users/user.model";
import { v4 as uuidv4 } from "uuid";

export class Video {
  @prop()
  public title: string;
  @prop()
  public description: string;
  @prop({ enum: ["mp4"] })
  public extension: string;
  @prop({ required: true, ref: () => User })
  public videoOwner: Ref<User>;

  @prop({ unique: true, default: uuidv4() })
  public videoId: string;

  @prop({ default: false })
  public published: boolean;
}

export const VideoModel = getModelForClass(Video, {
  schemaOptions: {
    timestamps: true,
  },
});
