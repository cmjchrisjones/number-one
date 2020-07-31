import { Client, query, ClientConfig } from 'faunadb'
import { User, Stream } from '../../models'
import { log, LogLevel } from '../../common'

export abstract class Fauna {

  private static client: Client

  public static init() {
    let config: ClientConfig = {
      secret: process.env.FAUNA_DB_SECRET
    }
    this.client = new Client(config)
  }

  private static mapResponse(payload: any): any {
    return {
      ...payload.data,
      _id: payload.ref.value.id
    }
  }

  public static async getUser(login: string): Promise<User | undefined> {
    let user: User
    try {
      let response = await this.client.query(
        query.Map(
          query.Paginate(
            query.Match(query.Index("users_login"), login)),
          query.Lambda("users", query.Get((query.Var("users"))))
        )
      ) as any
      if (response.data && response.data.length > 0) {
        user = this.mapResponse(response.data[0])
      }
    }
    catch (err) {
      log(LogLevel.Error, `Fauna:getUser - ${err}`)
    }
    return user
  }

  public static async saveUser(user: User): Promise<User> {
    let savedUser: User

    const existingUser: User = await this.getUser(user.login)

    if (user._id || existingUser) {
      const _id = user._id || existingUser._id
      // Update user
      try {
        let response = await this.client.query(
          query.Replace(query.Ref(query.Collection("users"), _id), {
            data: user
          })
        )
        savedUser = this.mapResponse(response)
      }
      catch (err) {
        log(LogLevel.Error, `Fauna:saveUser - Update: ${err}`)
      }
    }
    else {
      // Create user
      try {
        let response = await this.client.query(
          query.Create(query.Collection("users"), {
            data: user
          })
        )
        savedUser = this.mapResponse(response)
      }
      catch (err) {
        log(LogLevel.Error, `Fauna:saveUser - Create: ${err}`)
      }
    }
    return savedUser
  }

  public static async getStream(streamDate: string): Promise<Stream | undefined> {
    let stream: Stream
    try {
      let response = await this.client.query(
        query.Map(
          query.Paginate(
            query.Match(query.Index("streams_streamDate"), streamDate)),
          query.Lambda("streams", query.Get((query.Var("streams"))))
        )
      ) as any
      if (response.data && response.data.length > 0) {
        stream = this.mapResponse(response.data[0])
      }
    }
    catch (err) {
      log(LogLevel.Error, `Fauna:getStream - ${err}`)
    }
    return stream
  }

  public static async saveStream(stream: Stream): Promise<Stream> {
    let savedStream: Stream

    const existingStream: Stream | undefined = await this.getStream(stream.streamDate)

    if (stream._id || existingStream) {
      const _id = stream._id || existingStream._id
      // Update stream
      try {
        let response = await this.client.query(
          query.Replace(query.Ref(query.Collection("streams"), _id), {
            data: stream
          })
        )
        savedStream = this.mapResponse(response)
      }
      catch (err) {
        log(LogLevel.Error, `Fauna:saveStream - Update: ${err}`)
      }
    }
    else {
      // Create stream
      try {
        let response = await this.client.query(
          query.Create(query.Collection("streams"), {
            data: stream
          })
        )
        savedStream = this.mapResponse(response)
      }
      catch (err) {
        log(LogLevel.Error, `Fauna:saveStream - Create: ${err}`)
      }
    }
    return savedStream
  }

}